class RoutesController < ApplicationController
  def new
    @route = Route.new
    3.times do
      point = @route.points.build
    end
  end

  def create
    @route = Route.new(route_params)
    puts @route.inspect
    if @route.save
      flash[:notice] = "Successfully created route."
      redirect_to @route
    else
      render :action => 'new'
    end
  end

  def show
    @route = Route.find(params[:id])
  end

  def index
    @routes = Route.all
  end

  def edit
    @route = Route.find(params[:id])
  end

  def destroy
    @route = Route.find(params[:id])
    @route.destroy

    redirect_to routes_path
  end

  def update
    @route = Route.find(params[:id])
    
    if @route.update(route_params)
      redirect_to @route
    else
      render 'edit'
    end
  end

  private
    def route_params
      params.require(:route).permit(:name, :id, :_destroy, points_attributes: [:lat, :long, :order, :id, :_destroy])
    end
end
